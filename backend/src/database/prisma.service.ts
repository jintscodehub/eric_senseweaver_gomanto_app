import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class PrismaService {
  private readonly logger = new Logger(PrismaService.name);
  public connected = false;
  public client: any = null;

  async onModuleInit() {
    try {
      const mod = await import("@prisma/client");
      const PrismaClient = (mod as any).PrismaClient;
      if (!PrismaClient) throw new Error("PrismaClient missing");
      this.client = new PrismaClient();
      if (this.client?.$connect) {
        await this.client.$connect();
      }
      this.connected = true;
      this.logger.log("Prisma connected");
    } catch (err) {
      this.connected = false;
      this.client = null;
      this.logger.warn("Prisma connection failed, using mock fallback");
    }
  }
}
