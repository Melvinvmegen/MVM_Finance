import { FastifyBaseLogger, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { MultipartFile, FastifyMultipartBaseOptions } from "@fastify/multipart";

declare global {
  declare namespace API {
    export type This = {
      request: Omit<FastifyRequest, "user"> & { user?: LoggedUser };
      reply: FastifyReply;
      log: FastifyBaseLogger;
      user?: LoggedUser;
    };

    export type LoggedUser = {
      id: number;
      email: string;
      cryptosModuleActive: boolean;
      customersModuleActive: boolean;
      revenusModuleActive: boolean;
      bankIds: number[];
      cashPotsIds: number[];
    };

    export type DownloadReturns =
      | Stream
      | Buffer
      | { filename?: string; type?: string; stream?: Stream; buffer?: Buffer; body?: Buffer | Stream | any };

    export type UploadData = { file: import("@fastify/multipart").MultipartFile };

    export type ServerInstance = FastifyInstance & {
      $get: (path: string, handler: GetHandler) => void;
      $post: (path: string, handler: PostHandler) => void;
      $patch: (path: string, handler: PostHandler) => void;
      $put: (path: string, handler: PostHandler) => void;
      $delete: (path: string, handler: GetHandler) => void;
      $upload: (path: string, handler: UploadHandler, options?: FastifyMultipartBaseOptions) => void;
      $download: (path: string, handler: DownloadHandler, options?: { filename?: string; type?: string }) => void;
    };
  }
}
