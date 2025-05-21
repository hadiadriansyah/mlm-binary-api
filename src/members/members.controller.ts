import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { MembersService, D3TreeNode } from './members.service';

interface CreateMemberInput {
  name: string;
  address?: string;
  phone: string;
  email: string;
  uplineId?: number | null;
}

interface SearchQuery {
  q: string;
}

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() body: unknown) {
    const data = body as CreateMemberInput;
    return this.membersService.createMember(data);
  }

  @Put('/:id')
  update(@Param('id') id: number, @Body() body: Partial<CreateMemberInput>) {
    return this.membersService.updateMember(Number(id), body);
  }

  @Get('/tree')
  async getTree(): Promise<D3TreeNode[]> {
    return this.membersService.getTree();
  }

  @Get()
  search(@Query() query: unknown) {
    const q = (query as SearchQuery).q;
    return this.membersService.search({ q });
  }

  @Delete('/:id')
  delete(@Param('id') id: string) {
    return this.membersService.deleteMember(Number(id));
  }

  @Delete('/cascade/:id')
  deleteCascade(@Param('id') id: string) {
    return this.membersService.deleteMemberCascade(Number(id));
  }
}
