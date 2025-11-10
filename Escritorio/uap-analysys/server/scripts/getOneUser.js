require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function main(){
  try{
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/uap-db');
    const u = await User.findOne().lean();
    if(!u) console.log('NO_USER');
    else console.log(u._id.toString());
    await mongoose.disconnect();
  }catch(e){
    console.error(e);
    process.exit(1);
  }
}

main();
