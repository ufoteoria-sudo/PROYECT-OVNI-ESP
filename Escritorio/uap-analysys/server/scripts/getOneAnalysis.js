require('dotenv').config();
const mongoose = require('mongoose');
const Analysis = require('../models/Analysis');

async function main(){
  try{
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db');
    const a = await Analysis.findOne().lean();
    if(!a) {
      console.log('NO_ANALYSIS');
    } else {
      console.log(a._id.toString());
    }
    await mongoose.disconnect();
  }catch(e){
    console.error(e);
    process.exit(1);
  }
}

main();
