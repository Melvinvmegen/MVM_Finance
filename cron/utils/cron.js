const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cron = async (func, timeout, offset) => {
  await wait(offset || 0);
  while (true) {
    try {
      await func();
    } catch (err) {
      console.error("An error occured", err);
    }
    await wait(timeout);
  }
};

export { cron };
