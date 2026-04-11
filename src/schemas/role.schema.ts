import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true, trim: true, uppercase: true })
  name!: string;

  @Prop({ trim: true })
  description!: string;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Permission' }])
  permissions!: MongooseSchema.Types.ObjectId[];

  @Prop({ default: false })
  isSystemRole!: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
