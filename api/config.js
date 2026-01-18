// Vercel serverless function to inject API_URL
// This function reads API_URL from environment variable and returns JavaScript code
module.exports = function handler(req, res) {
    let apiUrl = process.env.API_URL || 'https://web-production-11ef2.up.railway.app/api/stats';
    
    // Если указан /api/stats, извлекаем базовый URL для eggchain
    let baseApiUrl = apiUrl;
    if (apiUrl.endsWith('/api/stats')) {
        baseApiUrl = apiUrl.replace('/api/stats', '/api');
    } else if (apiUrl.endsWith('/stats')) {
        baseApiUrl = apiUrl.replace('/stats', '/api');
    } else if (!apiUrl.endsWith('/api')) {
        baseApiUrl = apiUrl.endsWith('/') ? apiUrl + 'api' : apiUrl + '/api';
    }
    
    // Return JavaScript that sets window.API_URL (for stats) and window.EGGCHAIN_API_URL (for eggchain)
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS
    
    res.send(`window.API_URL = '${apiUrl}';\nwindow.EGGCHAIN_API_URL = '${baseApiUrl}';`);
};
