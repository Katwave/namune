class ExampleRoute {
  constructor(
    router,
    dependencies = {
      global: null,
      models: null,
      utils: null,
    }
  ) {
    this.router = router;
    this.dependencies = dependencies;
  }

  getExample(req, res) {
    return res
      .status(200)
      .json({ success: true, message: "Successfully found example!" });
  }

  getExampleHealth(req, res) {
    return res
      .status(200)
      .json({ success: true, message: "YAY! The API is healthy." });
  }

  registerRoutes() {
    this.router.get("/", this.getExample);
    this.router.get("/health", this.getExampleHealth);
  }
}

module.exports = ExampleRoute;
