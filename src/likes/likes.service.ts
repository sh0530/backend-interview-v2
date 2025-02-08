import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './entities/like.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    private productsService: ProductsService,
  ) {}

  async toggleLike(
    userId: string,
    productId: string,
  ): Promise<{ liked: boolean }> {
    const existingLike = await this.likeRepository.findOne({
      where: { userId, productId },
    });

    if (existingLike) {
      await this.likeRepository.remove(existingLike);
      await this.productsService.updateLikeCount(productId, false);
      return { liked: false };
    }

    const like = this.likeRepository.create({ userId, productId });
    await this.likeRepository.save(like);
    await this.productsService.updateLikeCount(productId, true);
    return { liked: true };
  }

  async findUserLikes(userId: string) {
    return await this.likeRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findProductLikes(productId: string) {
    return await this.likeRepository.find({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async checkUserLiked(userId: string, productId: string): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { userId, productId },
    });
    return !!like;
  }
}
