import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Order, formatDuration, paymentMethodLabels } from '@/types';
import { Clock, Eye, Receipt, User } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  onView: () => void;
}

export const OrderCard = ({ order, onView }: OrderCardProps) => {
  const isOpen = order.status === 'open';
  const isClosed = order.status === 'closed';

  const getStatusBadge = () => {
    switch (order.status) {
      case 'open':
        return <Badge className="bg-primary/20 text-primary border-primary animate-pulse">Aberta</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fechada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
    }
  };

  return (
    <Card
      className={`
        p-4 cursor-pointer transition-all hover:shadow-lg
        ${isOpen ? 'border-primary/50 bg-gradient-to-br from-primary/5 to-transparent' : 'border-border/50'}
      `}
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-mono text-sm text-muted-foreground">#{order.id.slice(0, 8)}</p>
          <div className="flex items-center gap-2 mt-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="font-medium">{order.customerName}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
        <div className="flex items-center gap-1">
          <Receipt className="h-4 w-4" />
          <span>{order.items.length} itens</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4" />
          <span>{formatDuration(order.createdAt, order.closedAt)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-primary">R$ {order.total.toFixed(2)}</p>
          {isClosed && order.paymentMethod && (
            <p className="text-xs text-muted-foreground">
              {paymentMethodLabels[order.paymentMethod]}
              {order.creditUsed && order.creditUsed > 0 && ` + R$ ${order.creditUsed.toFixed(2)} fiado`}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" className="hover:bg-muted">
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
