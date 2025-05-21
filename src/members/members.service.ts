import { Injectable, OnModuleDestroy, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, Member } from '@prisma/client';

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

export interface D3TreeNode {
  id: number;
  name: string;
  attributes: {
    email: string;
    phone: string;
    uplineId?: number | null;
  };
  children?: D3TreeNode[];
}

@Injectable()
export class MembersService implements OnModuleDestroy {
  private readonly prisma = new PrismaClient();

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async createMember(data: CreateMemberInput): Promise<Member> {
    const existing = await this.prisma.member.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone },
        ],
      },
    });

    if (existing) {
      throw new BadRequestException('A member with the same email or phone already exists.');
    }

    let uplineId = data.uplineId ?? null;

    if (uplineId) {
      uplineId = await this.findAvailableUpline(uplineId);
    }

    return this.prisma.member.create({
      data: {
        name: data.name,
        address: data.address ?? '',
        phone: data.phone,
        email: data.email,
        uplineId: uplineId ? Number(uplineId) : null,
      },
    });
  }

  async updateMember(id: number, data: Partial<CreateMemberInput>): Promise<Member> {
    const existing = await this.prisma.member.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Member with ID ${id} not found.`);
    }

    if (data.uplineId && data.uplineId === id) {
      throw new BadRequestException('A member cannot be their own upline.');
    }

    return this.prisma.member.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        uplineId: data.uplineId,
      },
    });
  }

  private async findAvailableUpline(uplineId: number): Promise<number | null> {
    const queue: number[] = [uplineId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      const downlines = await this.prisma.member.findMany({
        where: { uplineId: currentId },
        select: { id: true },
      });

      if (downlines.length < 2) {
        return currentId;
      }

      queue.push(...downlines.map((d) => d.id));
    }

    return null;
  }

  async getTree(): Promise<D3TreeNode[]> {
    const root = await this.prisma.member.findFirst({
      where: { uplineId: null },
    });

    if (!root) return [];

    const tree = await this.buildTree(root.id);
    return [tree];
  }

  private async buildTree(id: number): Promise<D3TreeNode> {
    const node = await this.prisma.member.findUnique({
      where: { id },
      include: { downlines: true },
    });

    if (!node) {
      throw new NotFoundException(`Member with ID ${id} not found.`);
    }

    const children = await Promise.all(
      node.downlines.map((child) => this.buildTree(child.id))
    );

    return {
      id: node.id,
      name: node.name,
      attributes: {
        email: node.email,
        phone: node.phone,
        uplineId: node.uplineId,
      },
      children: children.length ? children : undefined,
    };
  }

  async search(query: SearchQuery): Promise<any[]> {
    const { q } = query;

    const results = await this.prisma.member.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        upline: true,
        downlines: true,
      },
      take: 10,
    });

    return results.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      upline: member.upline ? {
        id: member.upline.id,
        name: member.upline.name,
      } : null,
      downlines: member.downlines.map((d) => ({
        id: d.id,
        name: d.name,
      })),
    }));
  }

  async deleteMember(id: number): Promise<Member> {
    const existing = await this.prisma.member.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Member with ID ${id} not found.`);
    }

    const childCount = await this.prisma.member.count({
      where: { uplineId: id },
    });

    if (childCount > 0) {
      throw new BadRequestException('This member still has downlines and cannot be deleted.');
    }

    return this.prisma.member.delete({ where: { id } });
  }

  async deleteMemberCascade(id: number): Promise<{ deleted: number }> {
    const existing = await this.prisma.member.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Member with ID ${id} not found.`);

    await this.deleteSubtree(id);
    return { deleted: id };
  }

  private async deleteSubtree(id: number): Promise<void> {
    const downlines = await this.prisma.member.findMany({
      where: { uplineId: id },
      select: { id: true },
    });

    for (const child of downlines) {
      await this.deleteSubtree(child.id);
    }

    await this.prisma.member.delete({ where: { id } });
  }
}
