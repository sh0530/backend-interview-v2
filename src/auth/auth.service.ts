import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<User> {
    const { email, nickname, password } = registerDto;

    try {
      // 입력값 검증
      if (!email || !nickname || !password) {
        throw new BadRequestException('모든 필드를 입력해주세요.');
      }

      // 이메일 형식 검증
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        throw new BadRequestException('유효하지 않은 이메일 형식입니다.');
      }

      // 비밀번호 복잡성 검증
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        throw new BadRequestException(
          '비밀번호는 최소 8자 이상이며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.',
        );
      }

      // 동시에 이메일과 닉네임 중복 체크
      const [emailExists, nicknameExists] = await Promise.all([
        this.userRepository.findOne({ where: { email } }),
        this.userRepository.findOne({ where: { nickname } }),
      ]);

      if (emailExists) {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }

      if (nicknameExists) {
        throw new ConflictException('이미 존재하는 닉네임입니다.');
      }

      // 유저 생성
      const user = this.userRepository.create(registerDto);
      const savedUser = await this.userRepository.save(user);

      // 비밀번호 필드 제외하고 반환
      const { password: _, ...result } = savedUser;
      return result as User;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '회원가입 중 오류가 발생했습니다.',
      );
    }
  }

  async login(
    loginInfo: LoginDto,
  ): Promise<{ accessToken: string; user: Partial<User> }> {
    const { email, password } = loginInfo;

    try {
      console.log('loginInfo', loginInfo);
      // 입력값 검증
      if (!email || !password) {
        throw new BadRequestException('이메일과 비밀번호를 모두 입력해주세요.');
      }

      // 유저 찾기
      console.log('121');
      const user = await this.userRepository.findOne({
        where: { email },
        select: ['id', 'email', 'password', 'nickname', 'createdAt'], // 필요한 필드만 선택
      });
      console.log('1223231');
      if (!user) {
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 잘못되었습니다.',
        );
      }

      // 비밀번호 검증
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        throw new UnauthorizedException(
          '이메일 또는 비밀번호가 잘못되었습니다.',
        );
      }

      // JWT 토큰 생성
      const payload = { id: user.id, email: user.email };
      const accessToken = this.jwtService.sign(payload);

      // 비밀번호 필드 제외하고 유저 정보 반환
      const { password: _, ...userInfo } = user;

      return {
        accessToken,
        user: userInfo,
      };
    } catch (error) {
      console.log(error);
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('로그인 중 오류가 발생했습니다.');
    }
  }

  async getProfile(userId: string): Promise<User> {
    try {
      if (!userId) {
        throw new BadRequestException('유효하지 않은 사용자 ID입니다.');
      }

      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'nickname', 'createdAt'],
        relations: ['reviews', 'likes'], // 관련된 리뷰와 좋아요 정보도 함께 가져옴
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      return user;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        '프로필 조회 중 오류가 발생했습니다.',
      );
    }
  }
}
