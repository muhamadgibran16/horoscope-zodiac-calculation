import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    this.logger.verbose(`Req ${request.method} ${request.url}`);
    const startProcessTime = Date.now();
    return next.handle().pipe(
      map((data) => {
        const response = context.switchToHttp().getResponse();
        const endProcessTime = Date.now();
        const processTime = endProcessTime - startProcessTime;
        this.logger.verbose(
          `Res ${request.method} ${response.statusCode} ${request.url} [${processTime}ms]`,
        );
        return data;
      }),
    );
  }
}
