# MoliStats - Estadísticas de Golf

Una aplicación moderna y elegante para registrar y visualizar estadísticas de golf, inspirada en el diseño del Masters de Augusta.

## 🏌️ Características

- **Diseño Moderno**: Colores característicos del Masters de Augusta (verde y amarillo)
- **Optimizada para Móvil**: Interfaz responsive diseñada para uso en dispositivos móviles
- **Registro de Usuarios**: Sistema de autenticación con Supabase
- **Estadísticas Detalladas**: Recopilación completa de estadísticas por hoyo
- **Dashboard Interactivo**: Visualización de estadísticas con gráficos y filtros
- **Base de Datos**: Almacenamiento seguro con Supabase

## 📊 Estadísticas Recopiladas

### Por Hoyo:
- **Par**: Par del hoyo (3, 4, 5)
- **Score**: Número de golpes
- **FIR**: Fairway in Regulation (Sí/No/NA)
- **GIR**: Green in Regulation (Sí/No)
- **Distancia GIR**: Metros desde donde se pega el golpe a GIR
- **Putts**: Número de putts en el hoyo
- **Up & Down**: (Sí/No/NA)
- **Sand Save**: (Sí/No/NA)
- **Penalidad**: (Sí/No)
- **Distancia Primer Putt**: Distancia en pies

### Estadísticas de Ronda:
- Score total
- Porcentaje FIR
- Porcentaje GIR
- GIR por intervalos de distancia
- Total de putts
- Porcentaje Scrambling
- Porcentaje Sand Saves
- Total de penalidades
- Distancias de primer putt por intervalos
- Make rate de putts por intervalos

## 🚀 Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <repository-url>
   cd golf-stats
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Supabase**
   - Crear una cuenta en [Supabase](https://supabase.com)
   - Crear un nuevo proyecto
   - Obtener las credenciales de la API

4. **Configurar variables de entorno**
   Crear un archivo `.env.local` en la raíz del proyecto:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```

5. **Configurar la base de datos**
   Ejecutar el siguiente SQL en el editor SQL de Supabase:

   ```sql
   -- Crear tabla de estadísticas de ronda
   CREATE TABLE round_stats (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     course_name TEXT NOT NULL,
     total_score INTEGER NOT NULL,
     fir_percentage DECIMAL(5,2) NOT NULL,
     gir_percentage DECIMAL(5,2) NOT NULL,
     gir_by_distance JSONB NOT NULL,
     total_putts INTEGER NOT NULL,
     scrambling_percentage DECIMAL(5,2) NOT NULL,
     sand_save_percentage DECIMAL(5,2) NOT NULL,
     total_penalties INTEGER NOT NULL,
     first_putt_distances JSONB NOT NULL,
     make_rate_putts JSONB NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Crear políticas de seguridad
   ALTER TABLE round_stats ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view their own stats" ON round_stats
     FOR SELECT USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own stats" ON round_stats
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own stats" ON round_stats
     FOR UPDATE USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own stats" ON round_stats
     FOR DELETE USING (auth.uid() = user_id);
   ```

6. **Ejecutar la aplicación**
   ```bash
   npm run dev
   ```

7. **Abrir en el navegador**
   La aplicación estará disponible en `http://localhost:3000`

## 🎯 Uso

### Nueva Ronda
1. Navega a "Nueva Ronda"
2. Introduce el nombre del campo
3. Completa las estadísticas para cada hoyo (1-18)
4. Al finalizar, inicia sesión para guardar la ronda

### Estadísticas
1. Navega a "Estadísticas"
2. Inicia sesión para ver tus datos
3. Usa los filtros para ver diferentes períodos:
   - Todas las rondas
   - Últimas 5 rondas
   - Últimas 20 rondas

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Supabase
- **Build Tool**: Vite

## 📱 Características Móviles

- Diseño responsive optimizado para móviles
- Navegación táctil intuitiva
- Formularios optimizados para pantallas pequeñas
- Gráficos adaptativos

## 🎨 Paleta de Colores

- **Verde Masters**: #0F5132
- **Verde Claro**: #1A5F3A
- **Verde Oscuro**: #0A3D1F
- **Amarillo Masters**: #FFD700
- **Oro**: #DAA520
- **Crema**: #F5F5DC

## 📈 Funcionalidades Futuras

- [ ] Exportar estadísticas a PDF
- [ ] Comparar rondas
- [ ] Estadísticas por campo
- [ ] Notificaciones de progreso
- [ ] Modo offline
- [ ] Integración con GPS para distancias

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes alguna pregunta o problema, por favor abre un issue en el repositorio. 