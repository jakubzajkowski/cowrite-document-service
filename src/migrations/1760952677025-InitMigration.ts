import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitMigration1760952677025 implements MigrationInterface {
  name = 'InitMigration1760952677025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notes" ("id" SERIAL NOT NULL, "userId" character varying NOT NULL, "title" character varying NOT NULL, "s3Key" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "size" integer NOT NULL, "tags" character varying NOT NULL, CONSTRAINT "PK_af6206538ea96c4e77e9f400c3d" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notes"`);
  }
}
