import express from 'express';
import stocksRouter from './routes/stocks';
import cors from 'cors';
import dolarRouter from './routes/dolar';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use('/stocks', stocksRouter);
app.use('/dolar', dolarRouter)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
