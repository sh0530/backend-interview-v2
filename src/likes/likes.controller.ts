import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/gurads/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../auth/entities/user.entity';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('products/:productId')
  async toggleLike(
    @Param('productId') productId: string,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.likesService.toggleLike(user.id, productId);
    } catch (error) {
      if (error.code === '23505') {
        // 유니크 제약조건 위반
        throw new ConflictException('이미 좋아요를 누른 상품입니다.');
      }
      throw error;
    }
  }

  @Get('users/me')
  async getMyLikes(@CurrentUser() user: User) {
    return await this.likesService.findUserLikes(user.id);
  }

  @Get('products/:productId')
  async getProductLikes(@Param('productId') productId: string) {
    const likes = await this.likesService.findProductLikes(productId);
    if (!likes.length) {
      throw new NotFoundException('좋아요 내역이 없습니다.');
    }
    return likes;
  }

  @Get('products/:productId/check')
  async checkLiked(
    @Param('productId') productId: string,
    @CurrentUser() user: User,
  ) {
    return {
      liked: await this.likesService.checkUserLiked(user.id, productId),
    };
  }
}
