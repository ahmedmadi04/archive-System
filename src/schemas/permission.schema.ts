import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Permission {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  name!: string;

  @Prop({ trim: true })
  description!: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);
