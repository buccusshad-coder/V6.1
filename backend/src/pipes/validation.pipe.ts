import { BadRequestException, Injectable, ValidationPipe as NestValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';

@Injectable()
export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors
          .map((error) => {
            const constraints = error.constraints || {};
            return `${error.property}: ${Object.values(constraints).join(', ')}`;
          })
          .join('; ');
        return new BadRequestException({
          statusCode: 400,
          message: messages,
          error: 'Bad Request',
        });
      },
    });
  }
}
