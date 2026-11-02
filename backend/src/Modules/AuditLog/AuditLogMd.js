import mongoose from "mongoose";

const changeSchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    label: { type: String, default: "" },
    from: { type: mongoose.Schema.Types.Mixed, default: null },
    to: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorLabel: { type: String, default: "" }, 
    action: { type: String, required: true, maxlength: 40 }, // مثل order.status
    entityType: { type: String, required: true, maxlength: 30 }, // settings | order | product | coupon | user
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    entityLabel: { type: String, default: "", maxlength: 150 },
    summary: { type: String, required: true, maxlength: 500 },
    changes: { type: [changeSchema], default: [] },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, createdAt: -1 });
auditLogSchema.index({ entityId: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
