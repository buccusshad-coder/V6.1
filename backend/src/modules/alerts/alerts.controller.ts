import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtGuard } from '../../guards/jwt.guard';
import { CreateAlertDto, UpdateAlertDto } from './dto';

@Controller('alerts')
@UseGuards(JwtGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@Request() req, @Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(req.user.userId, createAlertDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.alertsService.findAll(req.user.userId);
  }

  @Get('active')
  getActive(@Request() req) {
    return this.alertsService.getActiveAlerts(req.user.userId);
  }

  @Get('triggered')
  getTriggered(@Request() req) {
    return this.alertsService.getTriggeredAlerts(req.user.userId);
  }

  @Get('by-type/:type')
  getByType(@Request() req, @Param('type') type: string) {
    return this.alertsService.getAlertsByType(req.user.userId, type);
  }

  @Get('by-symbol/:symbol')
  getBySymbol(@Request() req, @Param('symbol') symbol: string) {
    return this.alertsService.getAlertsBySymbol(req.user.userId, symbol);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.alertsService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateAlertDto: UpdateAlertDto,
  ) {
    return this.alertsService.update(id, req.user.userId, updateAlertDto);
  }

  @Post(':id/trigger')
  trigger(@Request() req, @Param('id') id: string) {
    return this.alertsService.triggerAlert(id, req.user.userId);
  }

  @Post(':id/reset')
  reset(@Request() req, @Param('id') id: string) {
    return this.alertsService.resetAlert(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Request() req, @Param('id') id: string) {
    return this.alertsService.remove(id, req.user.userId);
  }
}
