const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

// Get messages of a conversation (paginated)
router.get("/:conversationId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    })
      .populate("sender", "username")
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// Create or get conversation between two users
router.post("/start", auth, async (req, res) => {
  const { recipientId } = req.body;
  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user, recipientId],
      });
      await conversation.save();
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
