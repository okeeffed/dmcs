import { inject, injectable } from 'inversify';
import {
  HandleErrorHelper,
  LoggerService,
  ValidationHelper,
  validateJoiSchema,
} from '@b707/service-common-util';
import { ContainerKeys } from '../config/ioc.keys';
import { IRoleService } from '../services/role.service';
import { ClientErrorCode, ErrorCodes } from '../models/errorCodes';
import { Role } from '@b707/access-control-contracts';
import {
  Get,
  Inject,
  OperationId,
  Response,
  Route,
  Tags,
  Queries,
} from '@tsoa/runtime';
import {
  ErrorResponse,
  ErrorResponseExampleInternalServerError,
  ErrorResponseExampleUnauthorizedError,
} from '../contracts/apis/common/errorResponse';
import { AdminTags } from '../contracts/apis/tags';
import { UserIdAndContextRoles } from '../framework/security/permissions/userPermissions.interface';
import { GetVisibleRolesV2QueryParams } from '@b707/access-control-contracts/schemas';

export interface IRoleV2Controller {
  getVisibleRoles(
    requesterInfo: UserIdAndContextRoles,
    queryParams?: Role.GetVisibleRolesV2QueryParams
  ): Promise<Role.GetVisibleRolesV2Response>;
}

@Route('v2/admin/roles')
@injectable()
export class RoleV2Controller implements IRoleV2Controller {
  constructor(
    @inject(LoggerService) private logger: LoggerService,
    @inject(ContainerKeys.IRoleService) private service: IRoleService,
    @inject(ContainerKeys.HandleErrorHelper)
    private handleError: HandleErrorHelper<ErrorCodes>,
    @inject(ContainerKeys.ValidationHelper)
    protected validationHelper: ValidationHelper<ErrorCodes>
  ) {}

  /**
   * @summary Gets all the roles visible to a user
   */
  @Get('/')
  @OperationId('GetVisibleRolesV2')
  @Tags(AdminTags.ROLES)
  @Response<ErrorResponse>(
    401,
    ClientErrorCode.Unauthorized,
    ErrorResponseExampleUnauthorizedError
  )
  @Response<ErrorResponse>(
    500,
    'Internal Server Error',
    ErrorResponseExampleInternalServerError
  )
  async getVisibleRoles(
    @Inject() requesterInfo: UserIdAndContextRoles,
    @Body() body: Role.GetVisibleRolesV2RequestBody,
    @Queries() queryParams: Role.GetVisibleRolesV2QueryParams = {}
  ): Promise<Role.GetVisibleRolesV2Response> {
    this.logger.trace(
      'getVisibleRoles() called',
      { requesterInfo, queryParams },
      this.constructor.name
    );

    try {
      const params =
        this.validationHelper.queryParameters<Role.GetVisibleRolesV2QueryParams>(
          validateJoiSchema(GetVisibleRolesV2QueryParams),
          queryParams
        );

      return await this.service.getVisibleRolesByBatchQuery(requesterInfo, {
        limit: params.limit,
        name: params.name,
        partyType: params.partyType,
        partyId: params.partyId,
        pageSize: params.pageSize,
        pageNumber: params.pageNumber,
      });
    } catch (error) {
      this.logger.error(
        'getVisibleRoles(): Error Occurred!',
        error,
        this.constructor.name
      );
      throw this.handleError.handleServiceErrors(
        error as Error,
        this.constructor.name
      );
    }
  }
}
