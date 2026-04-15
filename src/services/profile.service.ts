import { Injectable, BadGatewayException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import axios from 'axios';
import { Profile } from '../schemas/profile.schema';
import { v7 as uuidv7 } from 'uuid';
import {
  getAgeGroup,
  getTopCountry,
} from 'src/common/utils/classification.util';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name)
    private model: Model<Profile>,
  ) {}

  async findByName(name: string) {
    return this.model.findOne({ name }).lean();
  }

  async fetchExternal(name: string) {
    const [g, a, n] = await Promise.all([
      axios.get(`https://api.genderize.io?name=${name}`),
      axios.get(`https://api.agify.io?name=${name}`),
      axios.get(`https://api.nationalize.io?name=${name}`),
    ]);

    return { g: g.data, a: a.data, n: n.data };
  }

  async create(name: string) {
    const normalized = name.toLowerCase().trim();

    const existing = await this.findByName(normalized);
    if (existing) {
      return {
        status: 'success',
        message: 'Profile already exists',
        data: existing,
      };
    }

    const { g, a, n } = await this.fetchExternal(normalized);

    // edge cases
    if (!g.gender || g.count === 0) {
      throw new BadGatewayException('Genderize returned an invalid response');
    }

    if (!a.age) {
      throw new BadGatewayException('Agify returned an invalid response');
    }

    if (!n.country.length) {
      throw new BadGatewayException('Nationalize returned an invalid response');
    }

    const ageGroup = getAgeGroup(a.age);
    const topCountry = getTopCountry(n.country);

    const created = await this.model.create({
      id: uuidv7(),
      name: normalized,
      gender: g.gender,
      gender_probability: g.probability,
      sample_size: g.count,
      age: a.age,
      age_group: ageGroup,
      country_id: topCountry.country_id,
      country_probability: topCountry.probability,
    });

    return {
      status: 'success',
      data: created.toObject(),
    };
  }

  async findAll(query: any) {
    const filter: any = {};

    if (query.gender) filter.gender = new RegExp(`^${query.gender}$`, 'i');

    if (query.country_id)
      filter.country_id = new RegExp(`^${query.country_id}$`, 'i');

    if (query.age_group)
      filter.age_group = new RegExp(`^${query.age_group}$`, 'i');

    const data = await this.model.find(filter).lean();

    return {
      status: 'success',
      count: data.length,
      data,
    };
  }

  async findOne(id: string) {
    const profile = await this.model.findOne({ id }).lean();
    if (!profile) throw new Error('Profile not found');

    return {
      status: 'success',
      data: profile,
    };
  }

  async delete(id: string) {
    const res = await this.model.deleteOne({ id });
    if (!res.deletedCount) throw new Error('Profile not found');
  }
}
