import { Request, Response } from 'express';

export const login = async (req: Request, res: Response) => {
  const { ambulanceId, password } = req.body;
  
  // Hardcoded credentials for demo (as per original server.ts)
  if (ambulanceId === "AMB123" && password === "1234") {
    res.json({ 
      success: true, 
      token: "clearroute-demo-token-" + Date.now(),
      user: { id: "AMB123", role: "operator" }
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: "Invalid credentials" 
    });
  }
};
