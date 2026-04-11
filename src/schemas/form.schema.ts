import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Form {
  @Prop({ required: true, unique: true })
  actionCode!: string;

  @Prop({ required: true })
  employeeId!: string;

  @Prop({ required: true })
  employeeName!: string;

  @Prop({ required: true })
  actionDate!: Date;

  @Prop({ required: true })
  department!: string;

  @Prop({ required: true })
  fileName!: string;

  @Prop({ required: true })
  filePath!: string;

  @Prop({ enum: ['Active', 'Inactive', 'Archived'], default: 'Active' })
  status!: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  uploadedBy!: MongooseSchema.Types.ObjectId | any;
}

export const FormSchema = SchemaFactory.createForClass(Form);
