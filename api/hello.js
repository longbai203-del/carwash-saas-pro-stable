export default function handler(req, res) {
    res.status(200).json({ 
        success: true, 
        message: 'API 工作正常！',
        method: req.method 
    });
}