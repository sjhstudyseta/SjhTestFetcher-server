import app from './app.js';
import { PORT } from './util/secrets.js';

app.get('/', (req, res) => {
  res.send('Fetcher active! Try GET /fetch');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});