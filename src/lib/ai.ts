export async function generatePetReply(studentName: string, prompt: string, points: number): Promise<string> {
    const saved = localStorage.getItem('ai_config');
    if (!saved) return "（请先在右下角配置AI大模型哦～）";
    
    const config = JSON.parse(saved);
    if (!config.apiKey) return "（请先配置API Key哦～）";

    const systemPrompt = `你是一个面向K-12小学生的虚拟班级宠物。你的回答必须积极、阳光、不可包含任何成人、暴力、极端、讽刺内容。你需要鼓励孩子努力学习、遵守纪律，并在他们扣分时给予温暖的改进建议。
当前主人名字是：${studentName}，当前积分为：${points}分。请用简短可爱、拟人化的语气回答主人的话，限制在30个字以内。`;

    try {
        let url = config.baseUrl;
        let payload: any = {};
        let headers: any = {
            'Content-Type': 'application/json',
        };

        if (config.provider === 'gemini') {
            const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-2.5-flash'}:generateContent?key=${config.apiKey}`;
            payload = {
                contents: [
                    { role: 'user', parts: [{ text: systemPrompt + '\n主人说：' + prompt }] }
                ],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            };
            const res = await fetch(genUrl, { method: 'POST', headers, body: JSON.stringify(payload) });
            const data = await res.json();
            return data.candidates[0].content.parts[0].text;
        } else {
            // OpenAI format fallback for openai, deepseek, other
            url = url || 'https://api.openai.com/v1/chat/completions';
            if (!url.endsWith('/chat/completions')) url = url + '/chat/completions';
            headers['Authorization'] = `Bearer ${config.apiKey}`;
            payload = {
                model: config.model || 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 100
            };
            const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
            const data = await res.json();
            return data.choices[0].message.content;
        }
    } catch (e) {
        console.error(e);
        return "（网络好像有点问题，宠物没听懂呢）";
    }
}
