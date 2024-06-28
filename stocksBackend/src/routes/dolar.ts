import express, { Request, Response } from 'express';

const dolarRouter = express.Router();

dolarRouter.get('/getCCL', async (req: Request, res: Response) => {
  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/contadoconliqui");
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const dolarCCL = await response.json();
    res.json(dolarCCL.venta);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CCL dollar rate' });
  }
});

export default dolarRouter;
