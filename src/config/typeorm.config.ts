import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { User } from 'src/auth/entities/user.entity';
import { Product } from 'src/products/entities/product.entity';
import { ProductOption } from 'src/products/entities/product-option.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Like } from 'src/likes/entities/like.entity';

@Injectable()
export class TypeOrmConfigService {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 3306),
      username: this.configService.get('DB_USERNAME', 'practice_username'),
      password: this.configService.get('DB_PASSWORD', 'sh05301234!'),
      database: this.configService.get('DB_DATABASE', 'practice'),
      entities: [User, Product, ProductOption, Review, Like],
      synchronize: this.configService.get('DB_SYNCHRONIZE', true),
      logging: this.configService.get('DB_LOGGING', true),
    };
  }
}
