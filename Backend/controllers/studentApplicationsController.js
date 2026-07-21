const Application = require("../models/Application");
const Job = require("../models/Job");

const getStudentApplications = async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    const applications = await Application.findAll({
      where: { user_id },
      include: [
        { 
          model: Job, 
          attributes: ['title', 'company', 'location', 'type', 'salary'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getStudentApplications };