// src/products/products.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductOption } from './entities/product-option.entity';
import {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductOption)
    private productOptionRepository: Repository<ProductOption>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { options, ...productData } = createProductDto;

    // 트랜잭션 시작
    const queryRunner =
      this.productRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 상품 생성
      const product = this.productRepository.create({
        ...productData,
      });
      await queryRunner.manager.save(product);

      // 옵션 생성
      const productOptions = options.map((option) =>
        this.productOptionRepository.create({
          ...option,
          productId: product.id,
        }),
      );
      await queryRunner.manager.save(ProductOption, productOptions);

      await queryRunner.commitTransaction();

      return this.findOne(product.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(query: QueryProductDto) {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.options', 'options')
      .leftJoinAndSelect('product.reviews', 'reviews');

    // 검색 필터
    if (query.search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search)',
        {
          search: `%${query.search}%`,
        },
      );
    }

    // 브랜드 필터
    if (query.brand) {
      queryBuilder.andWhere('product.brand = :brand', { brand: query.brand });
    }

    // 가격 범위 필터
    if (query.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }
    if (query.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    // 사이즈 필터
    if (query.size) {
      queryBuilder.andWhere('options.size = :size', { size: query.size });
    }

    // 컬러 필터
    if (query.color) {
      queryBuilder.andWhere('options.color = :color', { color: query.color });
    }

    // 정렬
    switch (query.sort) {
      case 'price_asc':
        queryBuilder.orderBy('product.price', 'ASC');
        break;
      case 'price_desc':
        queryBuilder.orderBy('product.price', 'DESC');
        break;
      case 'name_asc':
        queryBuilder.orderBy('product.name', 'ASC');
        break;
      case 'name_desc':
        queryBuilder.orderBy('product.name', 'DESC');
        break;
      case 'likes_desc':
        queryBuilder.orderBy('product.likeCount', 'DESC');
        break;
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
    }

    // 페이지네이션
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['options', 'reviews', 'likes'],
    });

    if (!product) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const { options, ...productData } = updateProductDto;
    const product = await this.findOne(id);

    const queryRunner =
      this.productRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 기본 정보 업데이트
      if (Object.keys(productData).length > 0) {
        Object.assign(product, productData);
        await queryRunner.manager.save(product);
      }

      // 옵션 업데이트
      if (options) {
        // 기존 옵션 삭제
        await queryRunner.manager.delete(ProductOption, { productId: id });

        // 새 옵션 생성
        const productOptions = options.map((option) =>
          this.productOptionRepository.create({
            ...option,
            productId: id,
          }),
        );
        await queryRunner.manager.save(ProductOption, productOptions);
      }

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.productRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException('상품을 찾을 수 없습니다.');
    }
  }

  async updateLikeCount(id: string, increment: boolean): Promise<void> {
    const product = await this.findOne(id);
    product.likeCount += increment ? 1 : -1;
    await this.productRepository.save(product);
  }

  async updateStock(
    productId: string,
    optionId: string,
    quantity: number,
  ): Promise<void> {
    const option = await this.productOptionRepository.findOne({
      where: { id: optionId, productId },
    });

    if (!option) {
      throw new NotFoundException('상품 옵션을 찾을 수 없습니다.');
    }

    if (option.stock < quantity) {
      throw new BadRequestException('재고가 부족합니다.');
    }

    option.stock -= quantity;
    await this.productOptionRepository.save(option);
  }
}
