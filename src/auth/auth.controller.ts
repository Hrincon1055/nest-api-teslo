import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Auth, GetUser, RawHeaders } from './decorators';
import { RoleProtected } from './decorators/role-protected.decorator';
import { LoginUserDto, CreateUserDto } from './dto';
import { User } from './entities/user.entity';
import { UserRoleGuard } from './gurds/user-role.guard';
import { ValidRoles } from './interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  public createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }
  @Post('login')
  public loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }
  @Get('check-auth-status')
  @Auth()
  public checkAuthStaus(@GetUser() user: User) {
    return this.authService.checkAuthStaus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  public testingPrivateRoute(
    @Req() request: Express.Request,
    @GetUser() user: User,
    @GetUser('email') userEmail: string,
    @RawHeaders() rawHeaders: string[],
  ) {
    return {
      ok: true,
      message: 'Hola mundo',
      user,
      userEmail,
      rawHeaders,
    };
  }
  // @SetMetadata('roles', ['admin', 'super-user'])
  @Get('private2')
  @RoleProtected(ValidRoles.admin, ValidRoles.user)
  @UseGuards(AuthGuard(), UserRoleGuard)
  public privateRoute2(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }
  @Get('private3')
  @Auth(ValidRoles.admin, ValidRoles.user)
  public privateRoute3(@GetUser() user: User) {
    return {
      ok: true,
      user,
    };
  }
}
