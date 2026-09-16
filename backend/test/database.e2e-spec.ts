import { Test } from "@nestjs/testing";
import { DataSource } from "typeorm";
import { AppModule } from "../src/app.module";

describe("database connection", () => {
  it("PostgreSQLへ接続してSELECT 1を実行できる", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const dataSource = moduleRef.get(DataSource);

    await expect(dataSource.query("SELECT 1 AS value")).resolves.toEqual([{ value: 1 }]);

    await dataSource.destroy();
    await moduleRef.close();
  });
});
