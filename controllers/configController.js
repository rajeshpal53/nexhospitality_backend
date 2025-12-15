const Config = require('../models/Config');

// Get config(s) by key or all
exports.getConfig = async (req, res) => {
  try {
    const { key } = req.query;

    if (key) {
      const config = await Config.findOne({ where: { configKey: key } });
      if (!config) {
        return res.status(404).json({ success: false, message: 'Config not found' });
      }
      return res.json({ success: true, data: config });
    }

    const configs = await Config.findAll();
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// Create or Update config
exports.upsertConfig = async (req, res) => {
  try {
    const { configKey, configValue, environment, description } = req.body;

    const [config, created] = await Config.upsert(
      { configKey, configValue, environment, description },
      { returning: true }
    );

    res.json({
      success: true,
      message: created ? 'Config created' : 'Config updated',
      data: config,
    });
  } catch (error) {
    console.error('Error saving config:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};