import express, { Request, Response } from 'express';
import yahooFinance from 'yahoo-finance2';

const stocksRouter = express.Router();

stocksRouter.get('/getStockLastValue', async (req: Request, res: Response) => {
  const { symbol, market } = req.query;

  if (typeof symbol !== 'string' || typeof market !== 'string') {
    return res.status(400).send('Bad Request: Missing or invalid parameters.');
  }

  const marketTicker =
    market.toLowerCase() === 'bcba' ? `${symbol}.BA` : symbol;
  try {
    const quote = await yahooFinance.quote(marketTicker);
    const price = quote.regularMarketPrice?.toString();

    if (price) {
      res.json({ symbol, market, price });
    } else {
      res.status(404).send('Stock not found.');
    }
  } catch (error) {
    res.status(500).send('ERROR');
  }
});

export default stocksRouter;
