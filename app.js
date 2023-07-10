const express = require('express');
///

const app = express();

app.get('/v/:mg', async (req, res) => {
// Define the facebook video url
const v1 = req.params.mg;
 switch(v1){
    case 'MK': case'Hi':{
        res.send("yes");
    }
    default:
                    {
                        res.send("no");
                    }
 }
  
      
    }
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
