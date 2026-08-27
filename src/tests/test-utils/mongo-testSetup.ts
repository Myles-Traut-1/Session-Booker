import mongoose from "mongoose";

export const connectToDb = async () => {
    await mongoose.connect(process.env.MONGO_URI!);
}

export const disconnectFromDb = async () => {
    await mongoose.connection.close();
}

export const clearDatabase = async () => {
    const connections = mongoose.connection.collections;
    for(const key in connections) {
        await connections[key].deleteMany({});
    }
}