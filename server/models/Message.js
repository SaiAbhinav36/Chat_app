const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema(
    {
        text: String,
        roomId: String,
        sender: { type: String, required: true },
        mediaUrl: String
    }, {
    timestamps: true
}
);

module.exports = mongoose.model("Message", messageSchema);