const mongoose = require('mongoose');
require('dotenv').config();

const trainingImageSchema = new mongoose.Schema({
  category: String,
  type: String,
  description: String,
  imageUrl: String,
  uploadedBy: mongoose.Schema.Types.ObjectId
});

const TrainingImage = mongoose.model('TrainingImage', trainingImageSchema);

async function verify() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    const images = await TrainingImage.find().limit(5);
    console.log(`📊 Total imágenes de entrenamiento: ${images.length}\n`);
    
    images.forEach((img, idx) => {
      console.log(`Imagen ${idx + 1}:`);
      console.log(`  ID: ${img._id}`);
      console.log(`  Categoría: ${img.category}`);
      console.log(`  Tipo: ${img.type}`);
      console.log(`  Descripción: ${img.description}`);
      console.log(`  URL: ${img.imageUrl}`);
      console.log('');
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verify();
