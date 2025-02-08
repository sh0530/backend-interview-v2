import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import {
  CreateReviewDto,
  UpdateReviewDto,
  QueryReviewDto,
} from './dto/review.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async create(createReviewDto: CreateReviewDto, user: User): Promise<Review> {
    const review = this.reviewRepository.create({
      ...createReviewDto,
      userId: user.id,
    });
    return await this.reviewRepository.save(review);
  }

  async findAll(query: QueryReviewDto) {
    const { productId, userId, rating, page = 1, limit = 10 } = query;

    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.product', 'product');

    if (productId) {
      queryBuilder.andWhere('review.productId = :productId', { productId });
    }

    if (userId) {
      queryBuilder.andWhere('review.userId = :userId', { userId });
    }

    if (rating) {
      queryBuilder.andWhere('review.rating = :rating', { rating });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('review.createdAt', 'DESC');

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });

    if (!review) {
      throw new NotFoundException('리뷰를 찾을 수 없습니다.');
    }

    return review;
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    userId: string,
  ): Promise<Review> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new UnauthorizedException('자신의 리뷰만 수정할 수 있습니다.');
    }

    Object.assign(review, updateReviewDto);
    return await this.reviewRepository.save(review);
  }

  async remove(id: string, userId: string): Promise<void> {
    const review = await this.findOne(id);

    if (review.userId !== userId) {
      throw new UnauthorizedException('자신의 리뷰만 삭제할 수 있습니다.');
    }

    await this.reviewRepository.remove(review);
  }
}
