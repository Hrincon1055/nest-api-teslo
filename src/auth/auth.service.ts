import {
  Injectable,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, LoginUserDto } from './dto';
import { User } from './entities/user.entity';
@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}
  public async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...userData } = createUserDto;
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });
      await this.userRepository.save(user);
      delete user.password;
      return user;
    } catch (error) {
      this.handleDBErrors(error);
    }
  }
  public async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true },
    });
    if (!user) {
      throw new UnauthorizedException('Credentials are not valid (email)');
    }
    if (!bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Credentials are not valid (password)');
    }
    return user;
  }
  private handleDBErrors(errors: any): never {
    if (errors.code === '23505') throw new BadRequestException(errors.detail);
    this.logger.error(errors);
    throw new InternalServerErrorException(
      'Unexpected error, checkserver logs',
    );
  }
}
