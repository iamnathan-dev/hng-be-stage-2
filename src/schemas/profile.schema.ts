import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: { createdAt: 'created_at' } })
export class Profile {
  @Prop({ unique: true, lowercase: true, trim: true })
  name: string;

  @Prop() gender: string;
  @Prop() gender_probability: number;
  @Prop() sample_size: number;

  @Prop() age: number;
  @Prop() age_group: string;

  @Prop() country_id: string;
  @Prop() country_probability: number;

  @Prop() id: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
