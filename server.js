const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
}); 