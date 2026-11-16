import app from './app.js';
import { connectDatabase } from './store.js';

const port = Number(process.env.PORT || 4000);
await connectDatabase();
app.listen(port, () => console.info(`Tandem API running at http://localhost:${port}`));
