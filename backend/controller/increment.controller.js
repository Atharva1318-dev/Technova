let counter = 0;

/**
 * Simple counter - increments by 1 on each call
 */
export const incrementCounter = async (req, res) => {
  try {
    counter++;

    return res.status(200).json({
      success: true,
      counter: counter,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export default {
  incrementCounter,
};