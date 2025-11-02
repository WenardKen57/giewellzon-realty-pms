const Inquiry = require("../models/Inquiry");
const Property = require("../models/Property");
const { safeSend } = require("../configs/mailer");
const { isValidPHMobile } = require("../utils/validate");

async function submitInquiry(req, res, next) {
  try {
    const b = req.body || {};
    // Validate PH mobile if provided (optional field)
    if (b.customerPhone && !isValidPHMobile(String(b.customerPhone))) {
      return res.status(400).json({
        message:
          "Invalid phone number. Use PH mobile format like 09123456789 or +639123456789.",
      });
    }
    let propertyName;
    if (b.propertyId) {
      const p = await Property.findById(b.propertyId);
      if (p) propertyName = p.propertyName;
    }
    const inq = await Inquiry.create({
      firstName: b.firstName,
      lastName: b.lastName,
      customerEmail: b.customerEmail,
      customerPhone: b.customerPhone,
      message: b.message,
      inquiryType: b.inquiryType || "general",
      propertyId: b.propertyId || undefined,
      propertyName,
    });

    try {
      const adminEmail =
        process.env.NOTIFY_ADMIN_EMAIL || process.env.MAIL_FROM;
      if (adminEmail) {
        await safeSend({
          to: adminEmail,
          subject: "New Property Inquiry",
          html: `<p>New inquiry from ${inq.firstName || ""} ${
            inq.lastName || ""
          } (${inq.customerEmail}).</p>
                 <p>Type: ${inq.inquiryType}</p>
                 <p>Property: ${inq.propertyName || "N/A"}</p>
                 <p>Message: ${inq.message || ""}</p>`,
        });
      }
      inq.emailNotificationSent = true;
      inq.emailSentAt = new Date();
      await inq.save();
    } catch {}

    res.status(201).json(inq);
  } catch (e) {
    next(e);
  }
}

async function listInquiries(req, res, next) {
  try {
    const { status, propertyId, dateFrom, dateTo, limit, page } = req.query;
    const q = {};
    if (status) q.status = status;
    if (propertyId) q.propertyId = propertyId;
    if (dateFrom || dateTo) {
      q.createdAt = {};
      if (dateFrom) q.createdAt.$gte = new Date(dateFrom);
      if (dateTo) q.createdAt.$lte = new Date(dateTo);
    }
    const perPage = Math.min(Number(limit) || 50, 100);
    const skip = Math.max(((Number(page) || 1) - 1) * perPage, 0);

    const [data, total] = await Promise.all([
      Inquiry.find(q).sort({ createdAt: -1 }).skip(skip).limit(perPage),
      Inquiry.countDocuments(q),
    ]);
    res.json({ data, total, page: Number(page) || 1, limit: perPage });
  } catch (e) {
    next(e);
  }
}

async function getInquiry(req, res, next) {
  try {
    const doc = await Inquiry.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

async function markHandled(req, res, next) {
  try {
    const doc = await Inquiry.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });

    doc.status = "handled";
    doc.handledAt = new Date();
    if (req.user) {
      doc.handledBy = req.user.sub;
      doc.handledByName =
        req.user.fullName || req.user.username || req.user.email;
    }
    await doc.save();
    res.json(doc);
  } catch (e) {
    next(e);
  }
}
async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "new",
      "viewed",
      "contacted",
      "interested",
      "not_interested",
      "closed",
      "archived",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const inquiry = await Inquiry.findById(id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

    inquiry.status = status;
    inquiry.statusUpdatedAt = new Date();

    // Optional: record which agent updated it
    if (req.user) {
      inquiry.handledBy = req.user.sub;
      inquiry.handledByName =
        req.user.fullName || req.user.username || req.user.email;
    }

    await inquiry.save();
    res.json(inquiry);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  submitInquiry,
  listInquiries,
  getInquiry,
  markHandled,
  updateStatus,
};
