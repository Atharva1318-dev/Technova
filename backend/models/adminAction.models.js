import mongoose from "mongoose";
const { Schema, model } = mongoose;

const adminActionSchema = new Schema(
  {
    adminId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    actionType: { 
      type: String, 
      enum: [
        "advisor-approved", 
        "advisor-rejected", 
        "trade-corrected", 
        "user-suspended", 
        "user-activated",
        "dispute-resolved"
      ], 
      required: true 
    },
    targetUserId: { 
      type: Schema.Types.ObjectId, 
      ref: "User" 
    },
    targetTradeId: { 
      type: Schema.Types.ObjectId, 
      ref: "Trade" 
    },
    reason: { 
      type: String, 
      required: true 
    },
    previousData: { 
      type: Schema.Types.Mixed 
    }, // Store previous state for audit
    newData: { 
      type: Schema.Types.Mixed 
    }, // Store new state for audit
    notes: { 
      type: String, 
      maxlength: 1000 
    },
  },
  { timestamps: true }
);

const AdminAction = model("AdminAction", adminActionSchema);
export default AdminAction;
