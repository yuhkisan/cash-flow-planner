import { Test } from "@nestjs/testing";
import { AppController } from "./app.controller";

describe("AppController", () => {
  it("ヘルスチェックでokを返す", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    const controller = moduleRef.get(AppController);

    expect(controller.health()).toEqual({ status: "ok" });
  });
});
