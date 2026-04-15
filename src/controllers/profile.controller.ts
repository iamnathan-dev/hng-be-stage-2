import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Query,
  HttpCode,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { ProfilesService } from '../services/profile.service';

@Controller('api/profiles')
export class ProfilesController {
  constructor(private service: ProfilesService) {}

  @Post()
  create(@Body() dto: CreateProfileDto) {
    if (!dto.name) {
      throw new BadRequestException('Missing or empty name');
    }

    if (typeof dto.name !== 'string' || /^\d+$/.test(dto.name)) {
      throw new UnprocessableEntityException('Numeric name not allowed');
    }

    return this.service.create(dto.name);
  }

  @Get()
  findAll(@Query() query) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
